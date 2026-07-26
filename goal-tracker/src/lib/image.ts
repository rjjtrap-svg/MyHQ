import * as ImageManipulator from 'expo-image-manipulator';

/** Downsizes and compresses a photo before upload to keep Storage + Vision API costs down. */
export async function prepareImageForUpload(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1600 } }], {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return result.uri;
}
