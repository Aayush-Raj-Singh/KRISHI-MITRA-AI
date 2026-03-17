import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { PushNotifications } from "@capacitor/push-notifications";

import { dataUrlToFile } from "../utils/imageCompression";

export const isNativePlatform = () => Capacitor.isNativePlatform();

export const captureDiseaseImage = async () => {
  if (!isNativePlatform()) return null;
  const photo = await Camera.getPhoto({
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    quality: 80,
    width: 1280,
  });
  if (!photo.base64String) return null;
  const format = photo.format || "jpeg";
  const dataUrl = `data:image/${format};base64,${photo.base64String}`;
  const file = dataUrlToFile(dataUrl, `disease_${Date.now()}.${format}`);
  return { file, previewUrl: dataUrl };
};

export const initPushNotifications = async () => {
  if (!isNativePlatform()) return;
  const debug = import.meta.env.DEV;
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== "granted") {
    return;
  }
  await PushNotifications.register();

  PushNotifications.addListener("registration", (token) => {
    if (debug) {
      console.debug("push_registration", token.value);
    }
  });

  PushNotifications.addListener("registrationError", (err) => {
    if (debug) {
      console.warn("push_registration_error", err);
    }
  });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    if (debug) {
      console.debug("push_received", notification);
    }
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
    if (debug) {
      console.debug("push_action", notification);
    }
  });
};
