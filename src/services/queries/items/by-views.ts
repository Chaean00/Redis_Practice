import { itemsByViewsKey, itemsKey } from "$services/keys";
import { client } from "$services/redis";
import { deserialize } from "./deserialize";

export const itemsByViews = async (order: 'DESC' | 'ASC' = 'DESC', offset = 0, count = 10) => {
    // items:views는 Sorted Set이라 아무렇게나 뽑아도 오름차순으로 정렬되어있음
    // DIRECTION 옵션을 통해 내림차순으로 정렬
    let results: any = await client.sort(
        itemsByViewsKey(),
        {
            GET: [
                '#',
                `${itemsKey('*')}->name`,
                `${itemsKey('*')}->views`,
                `${itemsKey('*')}->endingAt`,
                `${itemsKey('*')}->imageUrl`,
                `${itemsKey('*')}->price`
            ],
            BY: 'nosort',
            DIRECTION: order, // 내림차순 정렬
            LIMIT: { // 개수 지정
                offset, count
            }
        }
    )

    const items = [];
    while (results.length) {
        const [id, name, views, endingAt, imageUrl, price, ...rest] = results;
        const item = deserialize(id, {name, views, endingAt, imageUrl, price}); 
        items.push(item);
        results = rest;
    }

    return items;
    
};
