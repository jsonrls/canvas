export default function RoomLoading(): React.ReactElement {
  return (
    <main className="room-loading" aria-label="Loading collaborative room">
      <div className="room-loading-header" />
      <div className="room-loading-body">
        <div className="room-loading-panel" />
        <div className="room-loading-editor" />
        <div className="room-loading-panel" />
      </div>
    </main>
  );
}
