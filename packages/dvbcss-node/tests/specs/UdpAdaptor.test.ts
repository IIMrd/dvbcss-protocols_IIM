import { UdpAdaptor } from '../../src/SocketAdaptors/UdpAdaptor.js';
import { EventEmitter } from 'events';
import { RemoteInfo, Socket } from 'dgram';
import { vi } from 'vite-plus/test';

type Mock = ReturnType<typeof vi.fn>;

class MockDgramSocket extends EventEmitter {
  public send: Mock;

  constructor() {
    super();
    this.send = vi.fn();
  }
}

class MockProtocol extends EventEmitter {
  public start: Mock;
  public stop: Mock;
  public isStarted: Mock;
  public handleMessage: Mock;

  constructor() {
    super();
    this.start = vi.fn();
    this.stop = vi.fn();
    this.isStarted = vi.fn();
    this.handleMessage = vi.fn();
  }
}

describe('UdpAdaptor', () => {
  let sock: MockDgramSocket;
  let protocol: MockProtocol;

  beforeEach(() => {
    sock = new MockDgramSocket();
    protocol = new MockProtocol();
  });

  it('exists', () => {
    expect(UdpAdaptor).toBeDefined();
  });

  it('calls start() on the protocol handler', () => {
    new UdpAdaptor(protocol as any, sock as unknown as Socket);
    expect(protocol.start).toHaveBeenCalled();
  });

  it('does call stop when the socket is closed', () => {
    new UdpAdaptor(protocol as any, sock as unknown as Socket);
    expect(protocol.stop).not.toHaveBeenCalled();
    (sock as any).emit('close', {});
    expect(protocol.stop).toHaveBeenCalled();
  });

  it('calls handleMessage on the protocol handler when the socket receives a message, passing the payload and routing information, with the payload converted to a Uint8Array', () => {
    const payload = 'foo';
    const rinfo: RemoteInfo = {
      address: '1.2.3.4',
      port: 5678,
      family: 'IPv4',
      size: payload.length,
    };
    const payloadExpected = new Uint8Array(Buffer.from(payload)).buffer;

    new UdpAdaptor(protocol as any, sock as unknown as Socket);

    (sock as any).emit('message', payload, rinfo);
    expect(protocol.handleMessage).toHaveBeenCalledWith(payloadExpected, rinfo);
  });

  it('calls send on the dgram socket when it receives a send event from the protocol handler, to pass on the payload as a buffer object', () => {
    const payload = 'baa';
    const rinfo: RemoteInfo = {
      address: '1.2.3.4',
      port: 5678,
      family: 'IPv4',
      size: payload.length,
    };
    const payloadExpected = Buffer.from('baa');

    new UdpAdaptor(protocol as any, sock as unknown as Socket);

    (protocol as any).emit('send', payload, rinfo);
    expect(sock.send).toHaveBeenCalledWith(
      payloadExpected,
      0,
      payloadExpected.length,
      rinfo.port,
      rinfo.address,
    );
  });

  it('ignores a received message on the socket after stop() is called, and therefore does not call handleMessage() on the protocol handler', () => {
    const payload = 'flrob';
    const rinfo: RemoteInfo = {
      address: '1.2.3.4',
      port: 5678,
      family: 'IPv4',
      size: payload.length,
    };

    const udpa = new UdpAdaptor(protocol as any, sock as unknown as Socket);
    udpa.stop();
    (sock as any).emit('message', payload, rinfo);
    expect(protocol.handleMessage).not.toHaveBeenCalled();
  });

  it('calls stop() on the protocol handler when stop() is called, but ignores a close event on the socket after stop() is called, and therefore does not call stop() on the protocol handler', () => {
    const udpa = new UdpAdaptor(protocol as any, sock as unknown as Socket);
    udpa.stop();
    expect(protocol.stop).toHaveBeenCalled();
    protocol.stop.mockClear();
    (sock as any).emit('close', {});
    expect(protocol.stop).not.toHaveBeenCalled();
  });
});
