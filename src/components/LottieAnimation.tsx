"use client";

import { useLottie } from "lottie-react";
import barterAnimation from "@/lottieFiles/Hero-Animation.json";

export default function LottieAnimation() {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: barterAnimation,
  };

  const { View } = useLottie(defaultOptions);

  return View;
}
