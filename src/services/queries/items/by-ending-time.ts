import { itemsByEndingAtKey, itemsKey } from "$services/keys";
import { client } from "$services/redis";
import { DateTime } from "luxon";
import { deserialize } from "./deserialize";

export const itemsByEndingTime = async (
	order: 'DESC' | 'ASC' = 'DESC',
	offset = 0,
	count = 10
) => {
	const ids = await client.zRange(
		itemsByEndingAtKey(),
		Date.now(),
		'+inf',
		{
			BY: 'SCORE',
			LIMIT: {
				offset,
				count
			}
		}
	);

	const results = await Promise.all(ids.map(id => client.hGetAll(itemsKey(id))));

	return results.map((item, i) => deserialize(ids[i], item));
};
