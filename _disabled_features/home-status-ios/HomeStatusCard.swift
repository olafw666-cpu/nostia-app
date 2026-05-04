// Removed from HomeView.swift (LazyVStack body, after welcome header)
// Re-enable by adding back to HomeView and restoring toggleHomeStatus() in HomeViewModel

// MARK: - Home Status Card (HomeView body)

/*
// Home status card
VStack(alignment: .leading, spacing: 8) {
    HStack {
        Text("Home Status").font(.headline).foregroundColor(.white)
        Spacer()
        Button {
            Task { await vm.toggleHomeStatus() }
        } label: {
            HStack(spacing: 5) {
                Image(systemName: vm.user?.isHomeOpen == true ? "house" : "lock")
                    .font(.system(size: 13))
                Text(vm.user?.isHomeOpen == true ? "Open" : "Closed")
            }
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.white)
                .padding(.horizontal, 16).padding(.vertical, 8)
                .glassEffect(in: Capsule())
                .overlay(
                    Capsule().stroke(
                        vm.user?.isHomeOpen == true ? Color.nostiaSuccess : Color.nostriaBorder,
                        lineWidth: 1
                    )
                )
        }
    }
    Text(vm.user?.isHomeOpen == true
         ? "Followers can see you're available to host"
         : "Toggle to let followers know your home is open")
        .font(.footnote).foregroundColor(Color.nostiaTextSecond)
}
.padding(16)
.glassEffect(in: RoundedRectangle(cornerRadius: 16))
*/

// MARK: - toggleHomeStatus() (HomeViewModel)

/*
func toggleHomeStatus() async {
    guard let u = user else { return }
    let newStatus = u.isHomeOpen ? "closed" : "open"
    do {
        let updated = try await AuthAPI.shared.updateMe(["homeStatus": newStatus])
        user = updated
    } catch {
        errorMessage = error.localizedDescription
    }
}
*/

// NOTE: homeStatus: String? and isHomeOpen: Bool remain on User.swift and Friend.swift
// (harmless data fields — the backend still stores/returns them)
// Backend toggle: PATCH /api/auth/me with body { "homeStatus": "open" | "closed" }
