import * as React from 'react';
import { getContext } from 'recompose';
import { OothClient, User } from 'ooth-client';
import { IDisposable } from 'rx';
import * as PropTypes from 'prop-types';

type Props = {
  client: OothClient;
  initialUser: User | null;
};

type Status = { user: User | null };

export class OothProvider extends React.Component<Props, Status> {
  public static childContextTypes: any = {
    oothClient: PropTypes.object.isRequired,
    user: PropTypes.object,
  };
  private subscription?: IDisposable;

  constructor(props: Props) {
    super(props);
    this.state = {
      user: props.initialUser,
    };
  }

  public componentDidMount(): void {
    this.props.client.start().then((user) => {
      this.setState({
        user,
      });
      this.subscription = this.props.client.user().subscribe((user) => {
        this.setState({
          user,
        });
      });
    });
  }

  public componentWillUnmount(): void {
    if (this.subscription) {
      this.subscription.dispose();
    }
  }

  public render(): JSX.Element | null {
    if (!this.props.children) {
      return null;
    }
    return React.Children.only(this.props.children);
  }

  public getChildContext(): any {
    const { client: oothClient } = this.props;
    const { user } = this.state;
    return {
      oothClient,
      user,
    };
  }
}

export const withOoth = getContext({
  oothClient: PropTypes.object.isRequired,
});

export const withUser = getContext({
  user: PropTypes.object,
});
