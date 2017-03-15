import React, {Component} from 'react'
import withOothNext from '../ooth-client'
import {graphql} from 'react-apollo'
import withApolloNext from '../apollo'
import gql from 'graphql-tag'
import {withOoth, withUser} from 'ooth-client-react'
import {compose} from 'recompose'
import Link from 'next/link'

export default compose(
  withOothNext,
  withApolloNext
)(() => {
  return <div>
    <Link href="/"><a>home</a></Link>
    <h1>Welcome to Ooth's Next.js example</h1>
    <LoginStatus/>
    <Posts/>
  </div>
})

class LoginStatusComponent extends Component {
  render() {
    const {oothClient, user} = this.props
    if (user) {
      return <div>
        Your user id is {user._id}
        <button onClick={() => {
          oothClient.logout()
        }}>Log out</button>
      </div>
    } else {
      return <div>
        Click on the button to create a guest session.<br/>
        <button onClick={() => {
          oothClient.authenticate('guest', 'register')
            .catch(err => {
              console.error(err)
            })
        }}>Log in</button>
      </div>
    }
  }
}
const LoginStatus = compose(
  withOoth,
  withUser
)(LoginStatusComponent)

const CreatePostQuery = gql`
  mutation($title: String!, $content: String!) {
    createPost(title: $title, content: $content) {
      _id
    }
  }
`
class CreatePostComponent extends Component {
  render() {
    const {user, mutate, onCreatePost} = this.props
    if (user) {
      return <form onSubmit={e => {
        e.preventDefault()
        mutate({
          variables: {
            title: this.title.value,
            content: this.content.value
          }
        }).then(({data}) => {
          if (onCreatePost) {
            onCreatePost()
          }
        }).catch(e => {
          console.error(e)
        })
      }}>
        <div>
          <label htmlFor="title">Title</label>
          <input ref={ref => {
            this.title = ref
          }}/>
        </div>
        <div>
          <label htmlFor="content">Content</label>
          <textarea ref={ref => {
            this.content = ref
          }}/>
        </div>
        <button>Create</button>
      </form>
    } else {
      return null
    }
  }
}
const CreatePost = compose(
  withUser,
  graphql(CreatePostQuery)
)(CreatePostComponent)


const PostsQuery = gql`
  query {
    posts {
      _id
      authorId
      title
      content
      comments {
        _id
        authorId
        content
      }
    }
  }
`
class PostsComponent extends Component {
  render() {
    const {data: {loading, posts, refetch: refetchPosts}} = this.props
    return <div>
      <CreatePost onCreatePost={refetchPosts}/>
      {loading
        ? <span>Loading...</span>
        :
          <ul>
            {posts.map(post => {
              return <li key={post._id}>
                <h3>{post.title}</h3>
                <span>From: {post.authorId}</span>
                <div>
                  {post.content}
                </div>
                <h4>Comments</h4>
                <CreateComment postId={post._id} onCreateComment={refetchPosts}/>
                {post.comments.map(comment => {
                  return <div key={comment._id}>
                    <span>From: {comment.authorId}</span>
                    <div>
                      {comment.content}
                    </div>
                  </div>
                })}
              </li>
            })}
          </ul>
      }
    </div>
  }
}
const Posts = graphql(PostsQuery)(PostsComponent)

const CreateCommentQuery = gql`
  mutation($postId: ID!, $content: String!) {
    createComment(postId: $postId, content: $content) {
      _id
    }
  }
`
class CreateCommentComponent extends Component {
  render() {
    const {user, mutate, onCreateComment, postId} = this.props
    if (user) {
      return <form onSubmit={e => {
        e.preventDefault()
        mutate({
          variables: {
            postId,
            content: this.content.value
          }
        }).then(({data}) => {
          if (onCreateComment) {
            onCreateComment()
          }
        }).catch(e => {
          console.error(e)
        })
      }}>
        <div>
          <textarea ref={ref => {
            this.content = ref
          }}/>
        </div>
        <button>Comment</button>
      </form>
    } else {
      return null
    }
  }
}
const CreateComment = compose(
  withUser,
  graphql(CreateCommentQuery)
)(CreateCommentComponent)

