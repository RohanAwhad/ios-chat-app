import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export async function convertImageToBase64(uri: string): Promise<{ base64: string; mimeType: string }> {
  // First resize and convert to JPEG
  const manipulatedImage = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 2048 } }], // Resize to max width of 2048px
    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Read the resized image as base64
  const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return {
    base64,
    mimeType: 'image/jpeg', // We convert all images to JPEG
  };
}

export async function copyImageToAppDirectory(uri: string): Promise<string> {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) {
    throw new Error('File does not exist');
  }

  const newUri = `${FileSystem.documentDirectory}${Date.now()}.jpg`;
  await FileSystem.copyAsync({
    from: uri,
    to: newUri,
  });

  return newUri;
}
