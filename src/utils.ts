export function wait(time: number) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      clearTimeout(timer)
      resolve()
    }, time)
  })
}
