import { itemsKey, itmesIndexKey } from "$services/keys";
import { client } from "$services/redis";
import { deserialize } from "./deserialize";

export const searchItems = async (term: string, size: number = 5) => {
    const cleaned = term
    .replaceAll(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .split(' ')
    .map(word => word ? `%${word}%` : '')
    .join(' ');

    if (cleaned === '') {
        return [];
    }

    const query = `(@name:(${cleaned}) => { $weight: 5.0 }) | (@descripttion: (${cleaned}))`

    const results = await client.ft.search(itmesIndexKey(), query, {
        LIMIT: {
            from: 0,
            size: size
        }
    });

    return results.documents.map(({id, value}) => deserialize(id, value as any));
};
