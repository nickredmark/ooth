import * as React from "react";
import { composeInitialProps } from "compose-next";
import { OothClient, User } from "ooth-client";
import { OothProvider } from "ooth-client-react";

const stringifyCookies = (cookies: { [key: string]: string }) =>
  Object.keys(cookies)
    .map((key: string) => `${key}=${cookies[key]}`)
    .join("; ");

export default (oothClient: OothClient) => {
  class OothProviderWithInitialProps extends React.Component<{ initialUser: User | undefined; children: React.Component }> {
    public static async getInitialProps(ctx: any): Promise<{ initialUser: User | undefined }> {
      return {
        initialUser: ctx.req
          ? await oothClient.method<User | undefined>("user", "user", null, { Cookie: stringifyCookies(ctx.req.cookies) })
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
