import { itemsKey, itmesIndexKey } from "$services/keys";
import { client } from "./client";
import { SchemaFieldTypes } from "redis";

export const createIndexes = async () => {
    const indexes = await client.ft._LIST();

    const exists = indexes.find(index => index === itmesIndexKey());

    if (exists) {
        return;
    }

    return client.ft.create(
        itmesIndexKey(),
        {
            name: {
                type: SchemaFieldTypes.TEXT,
                SORTABLE: true
            },
            description: {
                type: SchemaFieldTypes.TEXT,
                SORTABLE: false
            },
            ownerId: {
                type: SchemaFieldTypes.TAG,
                SORTABLE: false
            },
            endingAt: {
                type: SchemaFieldTypes.NUMERIC,
                SORTABLE: true
            },
            bids: {
                type: SchemaFieldTypes.NUMERIC,
                SORTABLE: true
            },
            views: {
                type: SchemaFieldTypes.NUMERIC,
                SORTABLE: true
            },
            price: {
                type: SchemaFieldTypes.NUMERIC,
                SORTABLE: true
            },
            likes: {
                type: SchemaFieldTypes.NUMERIC,
                SORTABLE: true
            }
        } as any,
        {
            ON: 'HASH',
            PREFIX: itemsKey('')
        }
    );
};
