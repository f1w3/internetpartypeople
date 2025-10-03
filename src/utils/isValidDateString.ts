import { parse, isValid } from "date-fns";

/**
 * yyyy-MM-dd 形式の文字列が正しい日付かどうかを判定する
 */
export function isValidDateString(dateStr: string): boolean {
	if (!dateStr) return false;
	const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
	return isValid(parsed);
}
