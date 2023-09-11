/** @format */
import { prisma } from "../../src/Prisma";
import { Alias, Post, PostTag, PostTagCategory, Tag, TagInfo, User } from ".prisma/client";
import bcrypt from "bcrypt";
import Util from "../../src/util/Util";

export async function createTestData() {
	await prisma.user.createMany({ data: userData });
	await prisma.post.createMany({ data: postData });
	await prisma.postTagCategory.createMany({ data: postTagCategoryData });
	await prisma.tag.createMany({ data: tagData });
	await prisma.postTag.createMany({ data: postTagData });
	await prisma.tagInfo.createMany({ data: tagInfoData });
	await prisma.alias.createMany({ data: tagAliasData });
}

export async function clearTestData() {
	await prisma.$queryRaw`DELETE FROM aliases;`;
	await prisma.$queryRaw`DELETE FROM taginfo;`;
	await prisma.$queryRaw`DELETE FROM image_tags;`;
	await prisma.$queryRaw`DELETE FROM image_tag_categories;`;
	await prisma.$queryRaw`DELETE FROM images;`;
	await prisma.$queryRaw`DELETE FROM tags;`;
	await prisma.$queryRaw`DELETE FROM users;`;
}

const hashPassword = function (password: string): string {
	return Util.makePhpBcryptHash(bcrypt.hashSync(password, 10));
};

export const UserUsername = "user1";
export const AdminUsername = "admin";
export const UserPassword = "abc123";
export const AdminPassword = "123abc";

export const userData: User[] = [
	{
		id: 1,
		name: AdminUsername,
		pass: hashPassword(AdminPassword),
		email: null,
		joindate: new Date(),
		class: "admin"
	},
	{
		id: 2,
		name: UserUsername,
		pass: hashPassword(UserPassword),
		email: null,
		joindate: new Date(),
		class: "user"
	}
];

export const postData: Post[] = [
	{
		id: 1,
		owner_id: 1,
		owner_ip: "",
		filename: "test.mp4",
		filesize: 2000000,
		hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		ext: "mp4",
		source: null,
		width: 640,
		height: 480,
		posted: new Date(),
		locked: "N",
		author: null,
		rating: "u",
		favorites: 0,
		parent_id: null,
		has_children: "N",
		numeric_score: 0
	},
	{
		id: 2,
		owner_id: 1,
		owner_ip: "",
		filename: "test2.mp4",
		filesize: 2000000,
		hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaab",
		ext: "mp4",
		source: null,
		width: 640,
		height: 480,
		posted: new Date(),
		locked: "N",
		author: null,
		rating: "u",
		favorites: 0,
		parent_id: null,
		has_children: "N",
		numeric_score: 0
	},
	{
		id: 3,
		owner_id: 2,
		owner_ip: "",
		filename: "test3.webm",
		filesize: 3000000,
		hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaac",
		ext: "webm",
		source: null,
		width: 640,
		height: 480,
		posted: new Date(),
		locked: "N",
		author: null,
		rating: "u",
		favorites: 0,
		parent_id: null,
		has_children: "N",
		numeric_score: 0
	}
];

export const tagData: Tag[] = [
	{
		id: 1,
		tag: "test1",
		count: 2
	},
	{
		id: 2,
		tag: "a:test2",
		count: 3
	},
	{
		id: 3,
		tag: "test3",
		count: 1
	}
];

export const postTagData: PostTag[] = [
	{ image_id: 1, tag_id: 1 },
	{ image_id: 2, tag_id: 1 },
	{ image_id: 1, tag_id: 2 },
	{ image_id: 2, tag_id: 2 },
	{ image_id: 3, tag_id: 2 },
	{ image_id: 1, tag_id: 3 }
];

export const postTagCategoryData: PostTagCategory[] = [
	{ category: "a", display_singular: "A", display_multiple: "As", color: "#ff00ff" }
];

export const tagInfoData: Omit<TagInfo, "id">[] = [{ tag_id: 1, description: "test" }];

export const tagAliasData: Alias[] = [
	{
		oldtag: "test1",
		newtag: "test1_b"
	}
];
