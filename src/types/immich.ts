export interface ImmichAsset {
  id: string
  deviceAssetId: string
  ownerId: string
  deviceId: string
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'OTHER'
  originalPath: string
  originalFileName: string
  originalMimeType?: string
  thumbhash?: string
  fileCreatedAt: string
  fileModifiedAt: string
  localDateTime: string
  updatedAt: string
  isFavorite: boolean
  isArchived: boolean
  isTrashed: boolean
  isOffline: boolean
  hasMetadata: boolean
  duration?: string
  exifInfo?: {
    city?: string
    country?: string
    dateTimeOriginal?: string
    description?: string
    exifImageHeight?: number
    exifImageWidth?: number
    make?: string
    model?: string
  }
}

export interface ImmichConfig {
  serverUrl: string
  apiKey: string
}

export interface DeleteAssetsRequest {
  ids: string[]
  force?: boolean
}

export interface DeleteAssetsResponse {
  count: number
}

export interface EnvUser {
  name: string
  apiKey: string
}

export interface EnvConfig {
  serverUrl: string
  users: EnvUser[]
}

export interface ImmichAlbum {
  id: string
  albumName: string
  assetCount?: number
  createdAt?: string
  updatedAt?: string
  albumThumbnailAssetId?: string
}

export interface AddAssetsToAlbumRequest {
  ids: string[]
}

export interface ImmichTag {
  id: string
  name: string
  value: string
}

// Subset of Immich's v3.2+ search filter
export interface SearchFilter {
  tagIds?: { none: string[] }
  visibility?: { eq: 'timeline' }
  type?: { eq: 'IMAGE' | 'VIDEO' }
}

export interface MetadataSearchRequest {
  size: number
  filter: SearchFilter
  orderBy: {
    field: 'fileCreatedAt'
    direction: 'asc' | 'desc'
  }
  cursor?: string
}

export interface MetadataSearchResponse {
  assets: {
    count: number
    items: ImmichAsset[]
    nextCursor?: string | null
  }
}
