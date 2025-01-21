import type { CreateUserAttrs } from '$services/types';
import { genId } from '$services/utils';
import { client } from '$services/redis';
import { usernamesKey, usernamesUniqueKey, usersKey } from '$services/keys';

export const getUserByUsername = async (username: string) => {
	// username 인수 사용 -> 사용자 ID 조회
	const deciamlId = await client.zScore(usernamesKey(), username);

	// 결과 조회
	if (!deciamlId) {
		throw new Error("유저가 존재하지 않습니다");
	}

	// ID를 다시 16진수로 변환
	const id = deciamlId.toString(16);
	// 유저 검색
	const user = await client.hGetAll(usersKey(id));
	// 역직렬화
	return deserialize(id, user)
};

export const getUserById = async (id: string) => {
	const user = await client.hGetAll(usersKey(id));

	return deserialize(id, user);
};

export const createUser = async (attrs: CreateUserAttrs) => {
	const id = genId(); // 16진수

	// 이미 usernames Set에 존재하는지 확인
	const exists = await client.sIsMember(usernamesUniqueKey(), attrs.username);
	if (exists) {
		throw new Error("Username is taken");
	}

	await client.hSet(usersKey(id), serialize(attrs));
	await client.sAdd(usernamesUniqueKey(), attrs.username);
	await client.zAdd(usernamesKey(), {
		value: attrs.username,
		score: parseInt(id, 16) // 16진수를 10진수로 변경
	})

	return id;
};

const serialize = (user: CreateUserAttrs) => {
	return {
		username: user.username,
		password: user.password
	};
};

const deserialize = (id: string, user: { [key: string]: string }) => {
	return {
		id,
		username: user.username,
		password: user.password
	};
};
