import { configureStore } from "@reduxjs/toolkit";
import policiesReducer from "./policiesSlice";

const store = configureStore({
  reducer: {
    policies: policiesReducer,
  },
});

export default store;
