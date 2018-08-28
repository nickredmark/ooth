import * as React from 'react';
import { getContext } from 'recompose';
import { OothClient, User } from 'ooth-client';
import * as PropTypes from 'prop-types';

type Props = {
  client: OothClient;
  initialUser: User | undefined;
};

type Status = { user: User | undefined };

export class OothProvider extends React.Component<Props, Status> {
  public static childContextTypes: any = {
    oothClient: PropTypes.object.isRequired,
    user: PropTypes.object,
  };

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
      this.props.client.on('user', this.onUser);
    });
  }

  public componentWillUnmount(): void {
    this.props.client.unsubscribe('user', this.onUser);
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

  private onUser = async (user: User) => {
    this.setState({
      user,
    });
  };
}

export const withOoth = getContext({
  oothClient: PropTypes.object.isRequired,
});

export const withUser = getContext({
  user: PropTypes.object,
});
