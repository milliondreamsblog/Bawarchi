import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type {
  FeedbackItem,
  FeedbackListResponse,
  FeedbackSentimentLabel,
  FeedbackSummary,
} from "@bawarchie/types";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { brand } from "@/constants/brand";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const SENTIMENT_STYLES: Record<FeedbackSentimentLabel, { bg: string; fg: string; label: string }> = {
  positive: { bg: "#D1FAE5", fg: "#065F46", label: "Positive" },
  neutral: { bg: "#F5F5F4", fg: "#57534E", label: "Neutral" },
  negative: { bg: "#FEE2E2", fg: "#991B1B", label: "Negative" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function FeedbackScreen() {
  const { user, token } = useAuth();
  const [data, setData] = useState<FeedbackListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchFeedback = useCallback(async () => {
    if (!token || !user?.id) return;
    const res = await api.get<FeedbackListResponse>(
      `/api/feedback?restaurantId=${encodeURIComponent(user.id)}`,
      { token }
    );
    if (!isMounted.current) return;
    if (res.success) {
      setData({ reviews: res.reviews, summary: res.summary });
      setError(null);
    } else {
      setError(res.error);
    }
  }, [token, user?.id]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeedback();
    setRefreshing(false);
  }, [fetchFeedback]);

  if (data == null && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={brand.navy} />
      </View>
    );
  }

  const reviews = data?.reviews ?? [];
  const summary = data?.summary;

  return (
    <FlatList
      data={reviews}
      keyExtractor={(r) => r._id}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={brand.navy}
        />
      }
      ListHeaderComponent={
        <View style={styles.headerArea}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {summary && <SummaryCards summary={summary} />}
        </View>
      }
      ListEmptyComponent={
        !error ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptySub}>
              Customer reviews submitted from the QR-flow will appear here.
            </Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => <ReviewCard review={item} />}
    />
  );
}

function SummaryCards({ summary }: { summary: FeedbackSummary }) {
  return (
    <View style={styles.summaryRow}>
      <SummaryTile
        value={summary.total.toString()}
        label="Reviews"
        icon="chat-bubble-outline"
      />
      <SummaryTile
        value={summary.avgRating ? summary.avgRating.toFixed(1) : "—"}
        label="Avg rating"
        icon="star"
      />
      <SummaryTile
        value={summary.total ? `${summary.positivePercent}%` : "—"}
        label="Positive"
        icon="thumb-up"
      />
    </View>
  );
}

function SummaryTile({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <View style={styles.summaryTile}>
      <MaterialIcons name={icon} size={18} color={brand.sky} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function ReviewCard({ review }: { review: FeedbackItem }) {
  const sentiment = review.sentiment?.label
    ? SENTIMENT_STYLES[review.sentiment.label]
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Stars rating={review.rating} />
        {sentiment && (
          <View style={[styles.pill, { backgroundColor: sentiment.bg }]}>
            <Text style={[styles.pillText, { color: sentiment.fg }]}>
              {sentiment.label}
            </Text>
          </View>
        )}
      </View>
      {review.text ? (
        <Text style={styles.reviewText}>{review.text}</Text>
      ) : (
        <Text style={styles.reviewEmpty}>No comment.</Text>
      )}
      {review.sentiment?.tags && review.sentiment.tags.length > 0 && (
        <View style={styles.tagRow}>
          {review.sentiment.tags.map((tag, idx) => (
            <View key={`${review._id}-tag-${idx}`} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={styles.meta}>
        Table {review.tableSlug} · {formatDate(review.createdAt)}
      </Text>
    </View>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <MaterialIcons
          key={n}
          name={n <= rating ? "star" : "star-border"}
          size={18}
          color={brand.warning}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brand.offwhite,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: brand.offwhite,
    flexGrow: 1,
  },
  headerArea: { gap: 12, paddingBottom: 16 },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: { color: brand.danger, fontSize: 13 },
  summaryRow: { flexDirection: "row", gap: 10 },
  summaryTile: {
    flex: 1,
    backgroundColor: brand.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    alignItems: "flex-start",
    gap: 6,
  },
  summaryValue: { color: brand.navy, fontSize: 20, fontWeight: "700" },
  summaryLabel: { color: brand.stoneMuted, fontSize: 12 },
  empty: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
    gap: 6,
  },
  emptyTitle: { color: brand.stoneText, fontSize: 17, fontWeight: "600" },
  emptySub: {
    color: brand.stoneMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  sep: { height: 12 },
  card: {
    backgroundColor: brand.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: brand.stoneBorder,
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stars: { flexDirection: "row", gap: 2 },
  reviewText: {
    color: brand.stoneText,
    fontSize: 14,
    lineHeight: 20,
  },
  reviewEmpty: {
    color: brand.stoneMuted,
    fontSize: 13,
    fontStyle: "italic",
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    backgroundColor: "#EDF2FA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: { color: brand.navy, fontSize: 11, fontWeight: "600" },
  meta: {
    color: brand.stoneMuted,
    fontSize: 11,
    marginTop: 2,
  },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
});
