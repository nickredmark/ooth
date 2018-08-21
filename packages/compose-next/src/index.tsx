import * as React from 'react';

export const addInitialProps = (getInitialProps: (ctx: any) => any) => {
  // tslint:disable-next-line:variable-name
  return (Component: React.ComponentType) =>
    class extends React.Component {
      public static getInitialProps(ctx: any): any {
        return getInitialProps(ctx);
      }
      public render(): JSX.Element {
        return <Component {...this.props} />;
      }
    };
};

export type ComponentWithInitialProps = React.ComponentType<any> & {
  getInitialProps?: (ctx?: any) => any;
};

// tslint:disable-next-line:variable-name
export const composeInitialProps = (Parent: ComponentWithInitialProps) => (Child: ComponentWithInitialProps) =>
  class extends React.Component<any> {
    public static async getInitialProps(ctx?: any): Promise<{ parentProps: any; childProps: any }> {
      return {
        parentProps: Parent.getInitialProps ? await Parent.getInitialProps(ctx) : {},
        childProps: Child.getInitialProps ? await Child.getInitialProps(ctx) : {},
      };
    }
    public render(): JSX.Element {
      return (
        <Parent {...this.props} {...this.props.parentProps}>
          <Child {...this.props} {...this.props.childProps} />
        </Parent>
      );
    }
  };
