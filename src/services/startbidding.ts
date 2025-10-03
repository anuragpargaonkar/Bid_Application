// src/services/startBiddingApi.ts

import { apiSlice } from "./apiSlice";
 
// --- Types ---

export interface BiddingCar {

  id: number;

  name: string;

  basePrice: number;

  closingTime: string;

  // Add other fields from your backend response here

}
 
export interface BiddingCarRegisterPayload {

  name: string;

  basePrice: number;

  closingTime: string;

  // Add other fields required for registration

}
 
// --- Start Bidding API ---

export const startBiddingAPI = apiSlice.injectEndpoints({

  endpoints: (builder) => ({

    getAllBiddingCars: builder.query<BiddingCar[], void>({

      query: () => ({

        url: `BeadingCarController/all`,

        method: "GET",

      }),

      providesTags: ["BIDDING"],

    }),
 
    biddingCarRegister: builder.mutation<BiddingCar, BiddingCarRegisterPayload>({

      query: (formData) => ({

        url: `BeadingCarController/carregister`,

        method: "POST",

        body: formData,

      }),

      invalidatesTags: ["BIDDING"],

    }),

  }),

});
 
export const {

  useGetAllBiddingCarsQuery,

  useBiddingCarRegisterMutation,

} = startBiddingAPI;

 