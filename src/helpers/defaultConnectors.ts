import {
  StarknetkitConnector,
  TokenboundConnector,
  TokenboundConnectorOptions,
} from "../connectors"

export const defaultConnectors = ({
  tokenboundOptions,
}: {
  tokenboundOptions: TokenboundConnectorOptions
}): StarknetkitConnector[] => {
  const defaultConnectors: StarknetkitConnector[] = []
  defaultConnectors.push(new TokenboundConnector(tokenboundOptions))
  return defaultConnectors
}
