import { Directory, File, Paths } from 'expo-file-system';

export async function persistImage(
  sourceUri: string,
  id: string,
): Promise<string> {
  if (!sourceUri) return sourceUri;

  try {
    const documentDir = Paths.document;
    if (sourceUri.startsWith(documentDir.uri)) {
      return sourceUri;
    }

    const scansDir = new Directory(documentDir, 'machine-scans');
    if (!scansDir.exists) {
      scansDir.create({ intermediates: true });
    }

    const ext = sourceUri.match(/\.([a-zA-Z0-9]{1,5})(?:\?|#|$)/)?.[1] ?? 'jpg';
    const destination = new File(scansDir, `${id}.${ext}`);
    new File(sourceUri).copy(destination);
    return destination.uri;
  } catch {
    return sourceUri;
  }
}
