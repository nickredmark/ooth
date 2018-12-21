import 'isomorphic-unfetch';

import { ApolloReducerConfig, InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloClient, ApolloClientOptions } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { HttpLink } from 'apollo-link-http';
import * as React from 'react';
import { ApolloProvider, getDataFromTree } from 'react-apollo';

let client: ApolloClient<any> | null = null;

const AP = ApolloProvider as any;

const getBrowserClient = (
  uri: string,
  opts: Partial<ApolloClientOptions<any>>,
  cacheOpts?: ApolloReducerConfig,
  initialData?: any,
) => {
  const link = new HttpLink({
    uri,
    credentials: 'include',
  });
  const cache = new InMemoryCache(cacheOpts);
  if (initialData) {
    cache.restore(initialData);
  }
  return new ApolloClient({
    link,
    cache,
    ...opts,
  });
};

const getServerClient = (
  uri: string,
  cookies: { [key: string]: string },
  opts: Partial<ApolloClientOptions<any>>,
  cacheOpts?: ApolloReducerConfig,
  initialData?: any,
  linkState?: any,
) => {
  let link: ApolloLink = new HttpLink({
    uri,
  });
  if (cookies && Object.keys(cookies).length) {
    const middlewareLink = new ApolloLink((operation, forward) => {
      operation.setContext({
        headers: {
          Cookie: Object.keys(cookies)
            .map((key) => `${key}=${cookies[key]}`)
            .join('; '),
        },
      });
      return forward!(operation);
    });
    link = middlewareLink.concat(link);
  }

  const cache = new InMemoryCache(cacheOpts);
  if (initialData) {
    cache.restore(initialData);
  }

  if (linkState) {
    link = ApolloLink.from([link, linkState]);
  }

  return new ApolloClient({
    link,
    cache,
    ssrMode: true,
    ...opts,
  });
};

const getClient = (
  uri: string,
  cookies: { [key: string]: string },
  opts: Partial<ApolloClientOptions<any>>,
  cacheOpts?: ApolloReducerConfig,
  initialData?: any,
  linkState?: any,
) => {
  if (!(process as any).browser) {
    // on server, create a new client for each request
    return getServerClient(uri, cookies, opts, cacheOpts, initialData, linkState);
  }
  // on client, create singleton
  if (!client) {
    client = getBrowserClient(uri, opts, cacheOpts, initialData);
  }
  return client;
};

export type Options = {
  url: string;
  opts?: ApolloReducerConfig;
  apolloOpts?: Partial<ApolloClientOptions<any>>;
  linkState?: any;
};

type Props = { initialData?: any; childProps?: any };

export default ({ url, opts, apolloOpts, linkState }: Options) => {
  // tslint:disable-next-line variable-name
  return (Component: React.ComponentType<any> & { getInitialProps?: (ctx: any) => Promise<any> }) =>
    class extends React.Component<Props> {
      private client: ApolloClient<any>;

      constructor(props: Props) {
        super(props);
        // On server, this client won't be doing any work, because all work has been done in getInitialProps
        this.client = getClient(url, {}, apolloOpts || {}, opts, props.initialData);
      }

      public static async getInitialProps(ctx: any): Promise<{ initialData: any; childProps: any }> {
        const cookies = ctx.req && ctx.req.cookies;
        const client = getClient(url, cookies, apolloOpts, linkState || {}, opts);

        const childProps = Component.getInitialProps ? await Component.getInitialProps(ctx) : {};

        if (!(process as any).browser) {
          const url = {
            query: ctx.query,
            pathname: ctx.pathname,
            asPath: ctx.asPath,
          };
          const app = (
            <AP client={client}>
              <Component url={url} {...childProps} />
            </AP>
          );
          await getDataFromTree(app);
        }

        return {
          childProps,
          initialData: client.cache.extract(),
        };
      }

      public render(): JSX.Element {
        return (
          <AP client={this.client}>
            <Component {...this.props} {...this.props.childProps} />
          </AP>
        );
      }
    };
};

export const clear = () => (client = null);
