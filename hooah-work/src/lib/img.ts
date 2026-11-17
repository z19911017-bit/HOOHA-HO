/** Use original public assets directly; avoids relying on Netlify Image CDN availability. */
export function cdn(src: string, _w: number, _h?: number) {
  return src
}
