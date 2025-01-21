import { bidHistoryKey, itemsByPriceKey, itemsKey } from '$services/keys';
import { client, withLock } from '$services/redis';
import type { CreateBidAttrs, Bid } from '$services/types';
import { DateTime } from 'luxon';
import { getItem } from "./items";

// const pause = (duration: number) => {
// 	return new Promise((resolve) => {
// 		setTimeout(resolve, duration);
// 	});
// };

export const createBid = async (attrs: CreateBidAttrs) => {
	return withLock(attrs.itemId, async (lcokedClient: typeof client, signal: any) => {
		const item = await getItem(attrs.itemId);

		if (!item) {
			throw new Error('Item이 존재하지 않습니다.');
		}

		if (item.price >= attrs.amount) {
			throw new Error('입찰가가 최고가보다 낮습니다.');
		}

		if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
			throw new Error('Item closed to bidding')
		}

		const serialized = serializeHistory(attrs.amount, attrs.createdAt.toMillis());

		if (signal.expired) {
			throw new Error("Lock expried, cant write any more data");
		}

		return Promise.all([
			lcokedClient.rPush(bidHistoryKey(attrs.itemId), serialized),
			lcokedClient.hSet(itemsKey(item.id), {
				bids: item.bids + 1,
					price: attrs.amount,
					highestBidUserId: attrs.userId
			}),
			lcokedClient.zAdd(itemsByPriceKey(), {
				value: item.id,
				score: attrs.amount
			})
		])
	})


	// second way
	// return client.executeIsolated(async (isolatedClient) => {
	// 	await isolatedClient.watch(itemsKey(attrs.itemId));

	// 	const item = await getItem(attrs.itemId);

	// 	if (!item) {
	// 		throw new Error('Item이 존재하지 않습니다.');
	// 	}

	// 	if (item.price >= attrs.amount) {
	// 		throw new Error('입찰가가 최고가보다 낮습니다.');
	// 	}

	// 	if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
	// 		throw new Error('Item closed to bidding')
	// 	}

	// 	const serialized = serializeHistory(attrs.amount, attrs.createdAt.toMillis());


	// 	return isolatedClient
	// 	.multi()
	// 	.rPush(bidHistoryKey(attrs.itemId), serialized)
	// 	.hSet(itemsKey(item.id), {
	// 		bids: item.bids + 1,
	// 			price: attrs.amount,
	// 			highestBidUserId: attrs.userId
	// 	})
	// 	.zAdd(itemsByPriceKey(), {
	// 		value: item.id,
	// 		score: attrs.amount
	// 	})
	// 	.exec();

	// 	// first way
	// 		// Promise.all([
	// 		// 	client.rPush(bidHistoryKey(attrs.itemId), serialized),
	// 		// 	client.hSet(itemsKey(item.id), {
	// 		// 		bids: item.bids + 1,
	// 		// 		price: attrs.amount,
	// 		// 		highestBidUserId: attrs.userId
	// 		// 	})
	// 		// ]);
	// })
};

export const getBidHistory = async (itemId: string, offset = 0, count = 10): Promise<Bid[]> => {
	const startIndex = -1 * offset - count;
	const endInedx = -1 - offset;

	const range = await client.lRange(bidHistoryKey(itemId), startIndex, endInedx);
	
	return range.map(bid => deserializeHistory(bid));
};

const serializeHistory = (amount: number, createdAt: number) => {
	return `${amount}:${createdAt}`;
}

const deserializeHistory = (stored: string) => {
	const [amount, createdAt] = stored.split(':');

	return {
		amount: parseFloat(amount),
		createdAt: DateTime.fromMillis(parseInt(createdAt))
	};
}