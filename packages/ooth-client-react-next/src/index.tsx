import * as React from "react";
import { composeInitialProps } from "compose-next";
import { OothClient, User } from "ooth-client";
import { OothProvider } from "ooth-client-react";

export default (oothClient: OothClient) => {
  class OothProviderWithInitialProps extends React.Component<{ initialUser: User | null; children: React.Component }> {
    public static async getInitialProps(ctx: any): Promise<{ initialUser: User | null }> {
      return {
        initialUser: ctx.req ? await oothClient.status(ctx.req.cookies) : await oothClient.start()
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
