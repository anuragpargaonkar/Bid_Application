// services/biddingAPI.ts
import { apiSlice } from "./apiSlice";

export interface BeadingCar {
  bidCarId: string;
  beadingCarId: string;
  basePrice?: number;
  closingTime?: string;
  [key: string]: any; // additional properties
}

export interface DealerBidParams {
  UserID: string | number;
  pageNo: number;
  pageSize: number;
}

export interface SetTimePayload {
  biddingTimerId?: string;
  startTime?: string;
  endTime?: string;
  [key: string]: any;
}

export interface CreateBiddingPayload {
  beadingCarId: string;
  startingPrice: number;
  startTime: string;
  endTime: string;
  [key: string]: any;
}

export const biddingAPI = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    biddingAllCard: builder.query<BeadingCar[], void>({
      query: () => ({ url: `/BeadingCarController/all`, method: "GET" }),
      providesTags: ["BIDDING"],
    }),

    AllDealerFinalBid: builder.query<any, DealerBidParams>({
      query: ({ UserID, pageNo, pageSize }) => ({
        url: `/Bid/getAllDealerFinalBids?buyerDealerId=${UserID}&pageNo=${pageNo}&pageSize=${pageSize}`,
        method: "GET",
      }),
      providesTags: ["BIDDING"],
    }),

    biddingCarByDealerId: builder.query<BeadingCar[], string | number>({
      query: (UserID) => ({ url: `/BeadingCarController/getByUserId1/${UserID}`, method: "GET" }),
      providesTags: ["BIDDING"],
    }),

    biddingCarById: builder.query<BeadingCar, string | number>({
      query: (carId) => ({ url: `/BeadingCarController/getbyId/${carId}`, method: "GET" }),
      providesTags: ["BIDDING"],
    }),

    biddingcarUpdate: builder.mutation<any, { data: any; beadingCarId: string }>({
      query: ({ data, beadingCarId }) => ({ url: `/BeadingCarController/edit/${beadingCarId}`, method: "PUT", body: data }),
      invalidatesTags: ["BIDDING"],
    }),

    biddingRemove: builder.mutation<any, string>({
      query: (carId) => ({ url: `/BeadingCarController/delete/${carId}`, method: "DELETE" }),
      invalidatesTags: ["BIDDING"],
    }),

    biddingCarRegister: builder.mutation<any, FormData>({
      query: (formdata) => ({ url: `/BeadingCarController/carregister`, method: "POST", body: formdata }),
      invalidatesTags: ["BIDDING"],
    }),

    startBiddingSetTime: builder.mutation<any, SetTimePayload>({
      query: (settime) => ({ url: `/Bidding/v1/SetTime`, method: "POST", body: settime }),
      invalidatesTags: ["BIDDING"],
    }),

    createBidding: builder.mutation<any, CreateBiddingPayload>({
      query: (bidding) => ({ url: `/Bidding/v1/CreateBidding`, method: "POST", body: bidding }),
      invalidatesTags: ["BIDDING"],
    }),

    getCarIdType: builder.query<any, string>({
      query: (beadingCarId) => ({
        url: `/uploadFileBidCar/getDocuments?beadingCarId=${beadingCarId}&DocumentType=coverImage`,
        method: "GET",
      }),
      providesTags: ["BIDDING"],
    }),

    getbeadingCarImage: builder.query<any, { beadingCarId: string }>({
      query: ({ beadingCarId }) => ({ url: `/uploadFileBidCar/getByBidCarID?beadingCarId=${beadingCarId}`, method: "GET" }),
      providesTags: ["BIDDING", "SALESPERSON"],
    }),

    getAllLiveBiddingCars: builder.query<BeadingCar[], void>({
      query: () => ({ url: `BeadingCarController/getAllLiveBiddingCars`, method: "GET" }),
      providesTags: ["BIDDING"],
    }),

    updateBidCar: builder.mutation<any, { beadingCarId: string; formDataTosend: FormData }>({
      query: ({ beadingCarId, formDataTosend }) => ({
        url: `/uploadFileBidCar/update?doc=abcd&doctype=cover&subtype=images&comment=xyz&bidDocumentId=${beadingCarId}`,
        method: "PATCH",
        body: formDataTosend,
      }),
      invalidatesTags: ["BIDDING"],
    }),

    biddingCarImageRemove: builder.mutation<any, { beadingCarId: string }>({
      query: ({ beadingCarId }) => ({
        url: `/uploadFileBidCar/delete?DocumentId=${beadingCarId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BIDDING"],
    }),

    UpdateBiddingTime: builder.mutation<any, SetTimePayload>({
      query: (settime) => ({ url: `/Bidding/v1/UpdateBiddingTime`, method: "POST", body: settime }),
      invalidatesTags: ["BIDDING"],
    }),

    // other queries can be added here with proper typing
  }),
});

export const {
  useBiddingAllCardQuery,
  useAllDealerFinalBidQuery,
  useBiddingCarByIdQuery,
  useBiddingcarUpdateMutation,
  useBiddingRemoveMutation,
  useBiddingCarRegisterMutation,
  useStartBiddingSetTimeMutation,
  useCreateBiddingMutation,
  useGetCarIdTypeQuery,
  useGetbeadingCarImageQuery,
  useGetAllLiveBiddingCarsQuery,
  useUpdateBidCarMutation,
  useBiddingCarImageRemoveMutation,
  useUpdateBiddingTimeMutation,
} = biddingAPI;
