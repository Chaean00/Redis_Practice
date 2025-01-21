import { itemsKey, userLikesKey } from "$services/keys";
import { client } from "$services/redis";
import { getItems } from "./items";

export const userLikesItem = async (itemId: string, userId: string) => {
    return client.sIsMember(userLikesKey(userId), itemId);
};

export const likedItems = async (userId: string) => {
    // 사용자가 좋아요를 누른 모든 항목의 ID 가져오기
    const ids = await client.SMEMBERS(userLikesKey(userId));

    // 해당 ID를 가진 모든 항목 해시를 가져와서 배열로 반환
    return getItems(ids);
};

export const likeItem = async (itemId: string, userId: string) => {
    const inserted = await client.sAdd(userLikesKey(userId), itemId);

    if (inserted) {
        await client.HINCRBY(itemsKey(itemId), "likes", 1);
    }
};

export const unlikeItem = async (itemId: string, userId: string) => {
    const removed = await client.sRem(userLikesKey(userId), itemId);
    
    if (removed) {
        return client.hIncrBy(itemsKey(itemId), "likes", -1);
    }


};

export const commonLikedItems = async (userOneId: string, userTwoId: string) => {
    const ids = await client.sInter([userLikesKey(userOneId), userLikesKey(userTwoId)]);

    return getItems(ids);
};
