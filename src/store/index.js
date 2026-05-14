import { configureStore } from "@reduxjs/toolkit";
import policiesReducer from "./policiesSlice";
import risksReducer from "./risksSlice";
import operativeEffectivenessReducer from "./operativeEffectivenessSlice";
import auditsReducer from "./auditsSlice";

const store = configureStore({
  reducer: {
    policies: policiesReducer,
    risks: risksReducer,
    operativeEffectiveness: operativeEffectivenessReducer,
    audits: auditsReducer,
  },
});

export default store;
