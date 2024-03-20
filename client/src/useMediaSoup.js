import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Device } from 'mediasoup-client';

const useMediaSoup = () => {

    const [remoteStreams, setRemoteStreams] = useState([]);

    let local_stream 

    useEffect(() => {
        const socket = io("https://meetapi.elancelearning.com/mediasoup");
    
        socket.on('connection-success', ({ socketId }) => {
          console.log(socketId)
          getLocalStream()
        })
    
        let device
        let rtpCapabilities
        let producerTransport
        let consumerTransports = []
        let audioProducer
        let videoProducer
    
        const getLocalStream = () => {
          navigator.mediaDevices.getUserMedia({
            audio: { autoGainControl: false, noiseSuppression: true, echoCancellation: false },
            video: {
              width: {
                min: 640,
                max: 1920,
              },
              height: {
                min: 400,
                max: 1080,
              }
            }
          })
          .then(streamSuccess)
          .catch(error => {
            console.log(error.message)
          })
        }
      
        let params = {
          // mediasoup params
          encodings: [
            {
              rid: 'r0',
              maxBitrate: 100000,
              scalabilityMode: 'S1T3',
            },
            {
              rid: 'r1',
              maxBitrate: 300000,
              scalabilityMode: 'S1T3',
            },
            {
              rid: 'r2',
              maxBitrate: 900000,
              scalabilityMode: 'S1T3',
            },
          ],
          codecOptions: {
            videoGoogleStartBitrate: 1000
          }
        }
      
        let audioParams ={ codecOptions: { opusDtx: true }};
        let videoParams = { params };
        let consumingTransports = [];
      
        const streamSuccess = (stream) => {
          local_stream = stream
          const localVideo = document.getElementById('localVideo');
          if (localVideo) {
            localVideo.srcObject = local_stream;
          }
        
          audioParams = { track: stream.getAudioTracks()[0], ...audioParams };
          videoParams = { track: stream.getVideoTracks()[0], ...videoParams };
      
          joinRoom()
        }
      
        let roomName = "anas"
        const joinRoom = () => {
          socket.emit('joinRoom', { roomName }, (data) => {
            console.log(`Router RTP Capabilities... ${data.rtpCapabilities}`)
            rtpCapabilities = data.rtpCapabilities
            createDevice()
          })
        }
    
        const createDevice = async () => {
          try {
            device = new Device()
        
            await device.load({
              routerRtpCapabilities: rtpCapabilities
            })
            console.log('Device RTP Capabilities', device.rtpCapabilities)
          } catch (error) {
            console.log(error)
            if (error.name === 'UnsupportedError')
              console.warn('browser not supported')
          }
          createSendTransport()
        }
    
        const createSendTransport = async() => {
          socket.emit('createWebRtcTransport', { consumer: false }, ({ params }) => {
            if (params.error) {
              console.log(params.error)
              return
            }
        
            console.log(params)

            producerTransport = device.createSendTransport(params)
            producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
              try {
                await socket.emit('transport-connect', {
                  dtlsParameters,
                })
        
                callback()
        
              } catch (error) {
                errback(error)
              }
            })
        
            producerTransport.on('produce', async (parameters, callback, errback) => {
              console.log(parameters)
        
              try {
                await socket.emit('transport-produce', {
                  kind: parameters.kind,
                  rtpParameters: parameters.rtpParameters,
                  appData: parameters.appData,
                }, ({ id, producersExist }) => {
                  callback({ id })
                  if (producersExist) getProducers()
                })
              } catch (error) {
                errback(error)
              }
            })
        
            connectSendTransport()
          })
        }
    
        const signalNewConsumerTransport = async (remoteProducerId) => {
          if (consumingTransports.includes(remoteProducerId)) return;
          consumingTransports.push(remoteProducerId);
        
          await socket.emit('createWebRtcTransport', { consumer: true }, ({ params }) => {
            if (params.error) {
              console.log(params.error)
              return
            }
            console.log(`PARAMS... ${params}`)
        
            let consumerTransport
            try {
              consumerTransport = device.createRecvTransport(params)
            } catch (error) {
              console.log(error)
              return
            }
        
            consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
              try {
                await socket.emit('transport-recv-connect', {
                  dtlsParameters,
                  serverConsumerTransportId: params.id,
                })
                callback()
              } catch (error) {
                errback(error)
              }
            })
        
            connectRecvTransport(consumerTransport, remoteProducerId, params.id)
          })
        }
    
        const connectSendTransport = async () => {
            
          audioProducer = await producerTransport.produce(audioParams);
          videoProducer = await producerTransport.produce(videoParams);
        
          audioProducer.on('trackended', () => {
            console.log('audio track ended')
          })
        
          audioProducer.on('transportclose', () => {
            console.log('audio transport ended')
          })
          
          videoProducer.on('trackended', () => {
            console.log('video track ended')
          })
        
          videoProducer.on('transportclose', () => {
            console.log('video transport ended')
          })
        }
    
        socket.on('new-producer', ({ producerId }) => signalNewConsumerTransport(producerId))
        
        const getProducers = () => {
          socket.emit('getProducers', producerIds => {
            console.log(producerIds)
            producerIds.forEach(signalNewConsumerTransport)
          })
        }
        
        const connectRecvTransport = async (consumerTransport, remoteProducerId, serverConsumerTransportId) => {
          await socket.emit('consume', {
            rtpCapabilities: device.rtpCapabilities,
            remoteProducerId,
            serverConsumerTransportId,
          }, async ({ params }) => {
            if (params.error) {
              console.log('Cannot Consume')
              return
            }
            console.log(`Consumer Params ${params}`)
            const consumer = await consumerTransport.consume({
              id: params.id,
              producerId: params.producerId,
              kind: params.kind,
              rtpParameters: params.rtpParameters
            })
        
            consumerTransports = [
              ...consumerTransports,
              {
                consumerTransport,
                serverConsumerTransportId: params.id,
                producerId: remoteProducerId,
                consumer,
              },
            ]

            const { track } = consumer;
            const newStream = new MediaStream([track]);
      
            setRemoteStreams((prevStreams) => [
              ...prevStreams,
              { id: remoteProducerId, stream: newStream, kind: track.kind },
            ]);
        
            socket.emit('consumer-resume', { serverConsumerId: params.serverConsumerId })
          })
        }
        
        socket.on('producer-closed', ({ remoteProducerId }) => {
          const producerToClose = consumerTransports.find(transportData => transportData.producerId === remoteProducerId)
          producerToClose.consumerTransport.close()
          producerToClose.consumer.close()
        
          consumerTransports = consumerTransports.filter(transportData => transportData.producerId !== remoteProducerId)
          setRemoteStreams(currentStreams => currentStreams.filter(stream => stream.id !== remoteProducerId));
        })
        
        return () => {
          socket.disconnect();
        };
      }, []);
      return{
        remoteStreams,
        local_stream
      }
};

export default useMediaSoup;
