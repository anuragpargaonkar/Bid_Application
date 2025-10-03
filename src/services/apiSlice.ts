// services/apiSlice.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const apiSlice = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://caryanamindia.prodchunca.in.net/Aucbidding",
    prepareHeaders: async (headers) => {
      try {
        const token = await AsyncStorage.getItem("token"); // get token from storage
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      } catch (error) {
        console.error("Error retrieving token from AsyncStorage", error);
      }
      return headers;
    },
  }),

  tagTypes: [
    "User",
    "Admin",
    "Dealer",
    "CAR",
    "DEALERBOOKING",
    "Inspector",
    "SALESPERSON",
    "Favorite",
    "BIDDING", // <-- Add this line
  ],

  endpoints: (builder) => ({}),
});
