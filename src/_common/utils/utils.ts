// utils/dateUtils.ts

export function formatDates<T extends { createdAt: Date; updatedAt: Date }>(data: T | T[]): any {
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  } else {
    return {
      ...data,
      createdAt: data.createdAt.toISOString(),
      updatedAt: data.updatedAt.toISOString(),
    };
  }
}
