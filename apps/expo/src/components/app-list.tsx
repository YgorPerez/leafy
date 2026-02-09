import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { FlashListProps } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";

/**
 * Props for the AppList component.
 */
export interface AppListProps<T> extends Omit<FlashListProps<T>, "renderItem"> {
  /** Data array to render */
  data: readonly T[] | null | undefined;
  /** Render function for each item */
  renderItem: FlashListProps<T>["renderItem"];
  /** Estimated height of each item for optimization */
  estimatedItemSize: number;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message or component */
  emptyMessage?: string | ReactNode;
  /** Error state */
  error?: Error | null;
  /** Key extractor function */
  keyExtractor?: (item: T, index: number) => string;
}

/**
 * High-performance list component built on FlashList.
 *
 * Features:
 * - Built-in loading, empty, and error states
 * - Automatic optimization with estimated item sizes
 * - Consistent styling across the app
 *
 * @example
 * ```tsx
 * <AppList
 *   data={foods}
 *   renderItem={({ item }) => <FoodCard food={item} />}
 *   estimatedItemSize={80}
 *   isLoading={isLoading}
 *   emptyMessage="No foods found"
 * />
 * ```
 */
export function AppList<T>({
  data,
  renderItem,
  estimatedItemSize,
  isLoading = false,
  emptyMessage = "No items",
  error,
  keyExtractor,
  ...props
}: AppListProps<T>) {
  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error.message}</Text>
      </View>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <View style={styles.centered}>
        {typeof emptyMessage === "string" ? (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        ) : (
          emptyMessage
        )}
      </View>
    );
  }

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      estimatedItemSize={estimatedItemSize}
      keyExtractor={keyExtractor}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    textAlign: "center",
  },
});

export { FlashList };
export type { FlashListProps };
