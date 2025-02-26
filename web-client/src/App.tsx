import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { ChatInterface } from './components/ChatInterface'

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
})

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ChatInterface />
    </ChakraProvider>
  )
}

export default App
