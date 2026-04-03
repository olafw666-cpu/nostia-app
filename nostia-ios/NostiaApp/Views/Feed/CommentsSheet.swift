import SwiftUI

struct CommentsSheet: View {
    let postId: Int
    @ObservedObject var vm: FeedViewModel
    @FocusState private var inputFocused: Bool

    var body: some View {
        NavigationStack {
            Group {
                if vm.isLoadingComments {
                    ProgressView().tint(Color.nostiaAccent).frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if vm.comments.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "bubble.right").font(.system(size: 48)).foregroundColor(Color.nostiaTextMuted)
                        Text("No comments yet").font(.headline).foregroundColor(.white)
                        Text("Be the first to comment!").font(.subheadline).foregroundColor(Color.nostiaTextSecond)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(alignment: .leading, spacing: 12) {
                            ForEach(vm.comments) { comment in
                                CommentRow(comment: comment)
                            }
                        }
                        .padding(16)
                    }
                }
            }
            .background(Color.nostiaBackground)
            .navigationTitle("Comments")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { inputFocused = false }
                        .foregroundColor(Color.nostiaAccent)
                }
            }
        }
        // Pin input above keyboard using safeAreaInset — correct iOS pattern
        .safeAreaInset(edge: .bottom) {
            HStack(spacing: 10) {
                TextField("Add a comment...", text: $vm.newComment, axis: .vertical)
                    .lineLimit(1...4)
                    .padding(.horizontal, 14).padding(.vertical, 10)
                    .background(Color.nostiaInput).cornerRadius(20)
                    .foregroundColor(.white)
                    .focused($inputFocused)
                Button {
                    Task { await vm.submitComment(postId: postId) }
                } label: {
                    if vm.isSubmittingComment {
                        ProgressView().tint(.white).frame(width: 36, height: 36)
                    } else {
                        Image(systemName: "paperplane.fill")
                            .foregroundColor(.white).frame(width: 36, height: 36)
                            .background(vm.newComment.trimmingCharacters(in: .whitespaces).isEmpty ? Color.nostiaTextMuted : Color.nostiaAccent)
                            .clipShape(Circle())
                    }
                }
                .disabled(vm.newComment.trimmingCharacters(in: .whitespaces).isEmpty || vm.isSubmittingComment)
            }
            .padding(.horizontal, 12).padding(.vertical, 8)
            .background(Color.nostiaCard.ignoresSafeArea(edges: .bottom))
            .overlay(Divider().background(Color.nostriaBorder), alignment: .top)
        }
    }
}

struct CommentRow: View {
    let comment: FeedComment
    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            AvatarView(name: comment.name, size: 34)
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(comment.name).font(.system(size: 13, weight: .semibold)).foregroundColor(.white)
                    Text(comment.timeAgo).font(.caption).foregroundColor(Color.nostiaTextMuted)
                }
                Text(comment.content).font(.system(size: 14)).foregroundColor(Color.nostiaTextSecond)
            }
            Spacer()
        }
    }
}
