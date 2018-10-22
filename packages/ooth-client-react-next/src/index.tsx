import * as React from "react";
import { composeInitialProps } from "compose-next";
import { OothClient, User } from "ooth-client";
import { OothProvider } from "ooth-client-react";

export default (getOothClient: OothClient | (() => OothClient)) => {
  let commonOothClient: OothClient;

  if (typeof getOothClient !== "function") {
    console.warn(
      "SECURITY WARNING: Don't pass OothClient directly to ooth-client-react-next. Instad pass a function that returns a new object. This is needed for SSR."
    );
  }

  const getActualOothClient = () => {
    if (typeof getOothClient !== "function") {
      return getOothClient;
    }

    if ((process as any).browser) {
      if (!commonOothClient) {
        commonOothClient = getOothClient();
      }

      return commonOothClient;
    }

    return getOothClient();
  };

  class OothProviderWithInitialProps extends React.Component<{ initialUser: User | undefined; children: React.Component }> {
    private oothClient: OothClient;

    constructor(props: any) {
      super(props);
      this.oothClient = getActualOothClient();
    }

    public static async getInitialProps(ctx: any): Promise<{ initialUser: User | undefined }> {
      const oothClient = getActualOothClient();

      return {
        initialUser: ctx.req
          ? await oothClient.fetchUser(ctx.req.headers && { cookie: ctx.req.headers.cookie })
          : await oothClient.start()
      };
    }

    public render(): JSX.Element {
      const { initialUser, children } = this.props;

      return (
        <OothProvider client={this.oothClient} initialUser={initialUser}>
          {children}
        </OothProvider>
      );
    }
  }

  return composeInitialProps(OothProviderWithInitialProps);
};
