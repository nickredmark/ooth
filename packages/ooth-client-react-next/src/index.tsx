import * as React from "react";
import { composeInitialProps } from "compose-next";
import { OothClient, User } from "ooth-client";
import { OothProvider } from "ooth-client-react";

export default (oothClient: OothClient) => {
  class OothProviderWithInitialProps extends React.Component<{ initialUser: User | undefined; children: React.Component }> {
    public static async getInitialProps(ctx: any): Promise<{ initialUser: User | undefined }> {
      return {
        initialUser: ctx.req
          ? await oothClient.fetchUser(ctx.req.headers && { cookie: ctx.req.headers.cookie })
          : await oothClient.start()
      };
    }

    public render(): JSX.Element {
      const { initialUser, children } = this.props;

      return (
        <OothProvider client={oothClient} initialUser={initialUser}>
          {children}
        </OothProvider>
      );
    }
  }

  return composeInitialProps(OothProviderWithInitialProps);
};
