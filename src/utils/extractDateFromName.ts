export function extractDateFromName(name: string): Date | null {
	const parts = name.split("-").slice(0, 3).join("-");
	const d = new Date(parts);
	return Number.isNaN(d.getTime()) ? null : d;
}
