import SwiftUI
import PhotosUI

struct CreatePostSheet: View {
    @ObservedObject var vm: FeedViewModel
    @State private var selectedPhoto: PhotosPickerItem?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Text input
                    TextField("What's on your mind?", text: $vm.newPostContent, axis: .vertical)
                        .lineLimit(4...10)
                        .padding(14)
                        .background(Color.nostiaInput).cornerRadius(12)
                        .foregroundColor(.white)

                    // Photo preview
                    if let imgData = vm.newPostImageData,
                       let data = Data(base64Encoded: imgData),
                       let uiImage = UIImage(data: data) {
                        ZStack(alignment: .topTrailing) {
                            Image(uiImage: uiImage)
                                .resizable().scaledToFill()
                                .frame(maxWidth: .infinity).frame(height: 180)
                                .clipped().cornerRadius(12)
                            Button {
                                vm.newPostImageData = nil
                                selectedPhoto = nil
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .font(.title2).foregroundColor(.white)
                                    .padding(6)
                            }
                        }
                    }

                    // Photo picker
                    PhotosPicker(selection: $selectedPhoto, matching: .images) {
                        Label("Add Photo", systemImage: "photo.on.rectangle")
                            .foregroundColor(Color.nostiaAccent)
                            .frame(maxWidth: .infinity)
                            .padding(14)
                            .background(Color.nostiaCard)
                            .cornerRadius(12)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.nostriaBorder, lineWidth: 1))
                    }
                    .onChange(of: selectedPhoto) { item in
                        Task {
                            if let data = try? await item?.loadTransferable(type: Data.self) {
                                // Compress and convert to base64
                                let img = UIImage(data: data)
                                let compressed = img?.jpegData(compressionQuality: 0.6) ?? data
                                vm.newPostImageData = compressed.base64EncodedString()
                            }
                        }
                    }
                }
                .padding(16)
            }
            .background(Color.nostiaBackground)
            .navigationTitle("New Post")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        vm.newPostContent = ""
                        vm.newPostImageData = nil
                        selectedPhoto = nil
                        vm.showCreateSheet = false
                    }
                    .foregroundColor(Color.nostiaTextSecond)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await vm.createPost() }
                    } label: {
                        if vm.isSubmitting {
                            ProgressView().tint(.white)
                        } else {
                            Text("Post").fontWeight(.semibold).foregroundColor(Color.nostiaAccent)
                        }
                    }
                    .disabled(vm.isSubmitting || (vm.newPostContent.trimmingCharacters(in: .whitespaces).isEmpty && vm.newPostImageData == nil))
                }
            }
        }
    }
}
