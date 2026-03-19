/** Split an array into batches of `size`. Used for Firestore `in` queries (max 10). */
export const chunk = <T>(items: T[], size: number): T[][] =>
  items.reduce<T[][]>((acc, item, index) => {
    if (index % size === 0) acc.push([]);
    acc[acc.length - 1].push(item);
    return acc;
  }, []);
