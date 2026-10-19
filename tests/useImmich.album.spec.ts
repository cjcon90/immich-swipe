import { createPinia, setActivePinia } from 'pinia'
import { vi } from 'vitest'
import type { Mock } from 'vitest'
import { useImmich } from '@/composables/useImmich'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { ImmichAsset } from '@/types/immich'

describe('useImmich album flow', () => {
  const dummyAsset: ImmichAsset = {
    id: 'asset-1',
    deviceAssetId: 'da-1',
    ownerId: 'owner-1',
    deviceId: 'device-1',
    type: 'IMAGE',
    originalPath: '/tmp/file.jpg',
    originalFileName: 'file.jpg',
    fileCreatedAt: new Date().toISOString(),
    fileModifiedAt: new Date().toISOString(),
    localDateTime: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
    isArchived: false,
    isTrashed: false,
    isOffline: false,
    hasMetadata: false,
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn() })))
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()

      if (url.endsWith('/tags') && init?.method === 'PUT') {
        return new Response(JSON.stringify([{ id: 'tag-1', name: 'Kept', value: 'Swipe/Kept' }]), { status: 200 })
      }

      if (url.includes('/search/random')) {
        return new Response(JSON.stringify([dummyAsset]), { status: 200 })
      }

      if (url.includes('/albums/')) {
        return new Response('{}', { status: 200 })
      }

      if (url.includes('/thumbnail')) {
        return new Response('', { status: 200 })
      }

      return new Response(JSON.stringify({}), { status: 200 })
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('adds current asset to album and counts as kept', async () => {
    const auth = useAuthStore()
    auth.setConfig('http://immich.example.com', 'api-key', 'Alice')
    const uiStore = useUiStore()

    const immich = useImmich()
    immich.currentAsset.value = dummyAsset

    await immich.keepPhotoToAlbum({ id: 'album-1', albumName: 'Family' })

    expect(uiStore.keptCount).toBe(1)
    const fetchMock = fetch as unknown as Mock
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/albums/album-1/assets'),
      expect.objectContaining({ method: 'PUT' })
    )
  })

  it('tags kept assets and untags them on undo', async () => {
    const auth = useAuthStore()
    auth.setConfig('http://immich.example.com', 'api-key', 'Alice')

    const immich = useImmich()
    immich.currentAsset.value = dummyAsset

    await immich.keepPhoto()
    const fetchMock = fetch as unknown as Mock
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/tags/tag-1/assets'),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ ids: ['asset-1'] }) })
    )

    await immich.undoLastAction()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/tags/tag-1/assets'),
      expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ ids: ['asset-1'] }) })
    )
  })

  it('asks the server for random assets without the kept tag', async () => {
    const auth = useAuthStore()
    auth.setConfig('http://immich.example.com', 'api-key', 'Alice')

    const immich = useImmich()
    await immich.loadInitialAsset()

    expect(immich.currentAsset.value?.id).toBe('asset-1')
    const fetchMock = fetch as unknown as Mock
    const [, init] = fetchMock.mock.calls.find(([url]) => String(url).includes('/search/random'))!
    expect(JSON.parse(init.body).filter).toEqual({
      tagIds: { none: ['tag-1'] },
      visibility: { eq: 'timeline' },
    })
  })
})
