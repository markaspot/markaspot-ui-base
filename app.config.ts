
import clientConfig from './config/clients'



if (!clientConfig) {
  throw new Error('No client configuration found')
}
export default defineAppConfig({
  ui: {
    primary: clientConfig.theme.colors?.primary,
    secondary: clientConfig.theme.colors?.secondary,
    gray: clientConfig.theme.colors?.gray,
    icons: 'heroicons',
  }
})
