/** Serve a /public image through the Netlify Image CDN at a given width. */
export function cdn(src: string, w: number, h?: number) {
  const q = new URLSearchParams({ url: src, w: String(w), fm: 'webp', q: '78' })
  if (h) {
    q.set('h', String(h))
    q.set('fit', 'cover')
  }
  return `/.netlify/images?${q.toString()}`
}
