import mitt from 'mitt'
import { provide, inject } from 'vue'


type Events = {
  'show-page': any; 
}


const EmitterKey = Symbol('emitter')


const emitter = mitt<Events>()


export const useEmitter = () => {
  return emitter
}


export const provideEmitter = () => {
  provide(EmitterKey, emitter)
  return emitter
}