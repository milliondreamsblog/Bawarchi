import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { brand } from "@/constants/brand";
import { useAuth } from "@/lib/auth-context";

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: brand.white }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.eyebrow}>BAWARCHIE</Text>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {user?.name ?? "Restaurant"}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user?.email ?? ""}
          </Text>
        </View>
        <View style={styles.divider} />
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={signOut}
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
        >
          <MaterialIcons name="logout" size={18} color={brand.danger} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerActiveTintColor: brand.navy,
        drawerInactiveTintColor: brand.stoneText,
        drawerActiveBackgroundColor: "#EDF2FA",
        drawerLabelStyle: { fontSize: 15, fontWeight: "500", marginLeft: -8 },
        drawerItemStyle: { borderRadius: 12, marginHorizontal: 10 },
        headerTintColor: brand.navy,
        headerStyle: {
          backgroundColor: brand.offwhite,
          shadowOpacity: 0,
          elevation: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: { color: brand.navy, fontWeight: "700" },
      }}
    >
      <Drawer.Screen
        name="orders"
        options={{
          title: "Live orders",
          drawerLabel: "Orders",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="receipt-long" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="kitchen"
        options={{
          title: "Kitchen",
          drawerLabel: "Kitchen",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="local-fire-department" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="items"
        options={{
          title: "Items",
          drawerLabel: "Items",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="restaurant-menu" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="menu"
        options={{
          title: "Menu",
          drawerLabel: "Menu",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="book" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="tables"
        options={{
          title: "Tables",
          drawerLabel: "Tables",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="table-restaurant" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="inventory"
        options={{
          title: "Inventory",
          drawerLabel: "Inventory",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="feedback"
        options={{
          title: "Feedback",
          drawerLabel: "Feedback",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="rate-review" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: "Settings",
          drawerLabel: "Settings",
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  eyebrow: {
    color: brand.sky,
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: "600",
    marginBottom: 6,
  },
  restaurantName: {
    color: brand.navy,
    fontSize: 18,
    fontWeight: "700",
  },
  email: {
    color: brand.stoneMuted,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: brand.stoneBorder,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: brand.stoneBorder,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: brand.white,
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  pressed: { opacity: 0.6 },
  signOutText: {
    color: brand.danger,
    fontSize: 14,
    fontWeight: "600",
  },
});
