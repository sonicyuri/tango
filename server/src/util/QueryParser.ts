import * as mysql from "mysql2";
import { Tokenizr, Token } from "ts-tokenizr";

type TokenType = "tag" | "property" | "negate" | "number" | "prop_value";

export class QueryTokenizer
{
	private static properties: string[] = ["order", "favorited_by"];

	static tokenize(str: string): Token[]
	{
		return this.createLexer().input(str.toLowerCase()).tokens();
	}

	private static createLexer(): Tokenizr
	{
		let lexer = new Tokenizr({
			debug: true
		});

		lexer.rule(/[a-zA-Z_]([a-zA-Z0-9_])+?/, (ctx, match) =>
		{
			let val = match[0];
			if (this.properties.indexOf(val))
			{
				ctx.accept("property", val);	
			}
			else
			{
				ctx.accept("tag", match[0]);	
			}
		});

		lexer.rule(/\-/, (ctx, match) =>
		{
			ctx.accept("negate");
		});

		lexer.rule(/(\:|\=)/, (ctx, match) =>
		{
			ctx.accept("prop_value");
		});

		lexer.rule(/[0-9]+/, (ctx, match) =>
		{
			ctx.accept("number", match[0]);
		});

		lexer.rule(/[ \t\r\n]+/, (ctx, match) =>
		{
			ctx.ignore()
		});

		return lexer;
	}
}

interface IQueryCondition
{
	negated: boolean;

}

interface ParsedQuery
{
	
}

export type QueryParams = { queryString: string, params: any[] };

export default class QueryParser
{
	/**
	 * Creates a SQL query from a search string.
	 * @param str The search string.
	 * @notes The currently supported search parameters are:
	 * 		  - a tag: animated anim*
	 * 		  - negating
	 * 		  - order: order:rand order:score order:date order:width order:height order:filesize order:filename order:rand:desc order:rand:asc
	 * 		  - conditionals: width:>500 height:400 filesize:<3M filesize hash filetype filename num_tags favorites comments source
	 * 		  - properties: favorited_by favorited_by_id user user_id upvoted_by upvoted_by_id downvoted_by downvoted_by_id commented_by commented_by_id parent child
	 */
	static createSqlQueryFromSearchQuery(str: string) : QueryParams
	{
		let tags: string[] = [];
		let tagsNegate: string[] = [];
		let order: string | null = "";

		let tokens = QueryTokenizer.tokenize(str);
		for (let i = 0; i < tokens.length; i++)
		{
			let token = tokens[i];
			
			if (token.type == "tag")
			{
				tags.push(token.text);	
			}
			else if (token.type == "negate")
			{
				if (i < tokens.length - 1 && tokens[i + 1].type == "tag")
				{
					tagsNegate.push(tokens[i + 1].text);
					i += 1;
				}
				else 
				{
					throw new Error("invalid negate");	
				}
			}
			else if (token.type == "property")
			{
				let prop = token.text;
				let sepFollows = i < tokens.length - 1 && tokens[i + 1].type == "prop_value";
				if (prop == "order" && sepFollows)
				{
					
				}
			}
		}
	}
}