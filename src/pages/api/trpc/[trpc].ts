// src/pages/api/trpc/[trpc].ts
import * as trpc from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { z } from 'zod';
import * as AWS from 'aws-sdk';
import Rekognition from 'aws-sdk/clients/rekognition';
import S3 from 'aws-sdk/clients/s3';
import { TRPCError } from '@trpc/server';
import { uuid } from '../../../utils/uuid';

// AWS SDK configuration
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
});

const rekog = new Rekognition();
const s3 = new S3();

export const appRouter = trpc
  .router()
  .mutation('indexFace', {
    input: z.object({
      image: z.string(),
      name: z.string(),
      aadhar: z.string(),
      from: z.string(),
      to: z.string(),
      trainName: z.string(),
    }),
    async resolve({ input }) {
      try {
        const { image, name, aadhar, from, to, trainName } = input;
        const base64Img = image.replace('data:image/jpeg;base64,', '');
        const imgBuffer = Buffer.from(base64Img, 'base64');
        const imageId = uuid();

        // Add face to Rekognition collection
        await rekog.indexFaces({
          CollectionId: 'digirail_face',
          ExternalImageId: imageId,
          Image: { Bytes: imgBuffer },
        }).promise();

        // Add face image with metadata to S3 bucket (use lowercase keys)
        await s3.putObject({
          Bucket: 'digirail-s3-face',
          Key: 'faces/' + imageId + '.jpg',
          Body: imgBuffer,
          Metadata: {
            name,
            aadhar,
            from,
            to,
            trainname: trainName, // store in lowercase
          },
        }).promise();

        return true;
      } catch (e) {
        console.error(e);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to index face',
        });
      }
    },
  })
  .mutation('searchFaceByImage', {
    input: z.object({ image: z.string() }),
    async resolve({ input }) {
      const base64Img = input.image.replace('data:image/jpeg;base64,', '');
      const imgBuffer = Buffer.from(base64Img, 'base64');
      const res = await rekog.searchFacesByImage({
        CollectionId: 'digirail_face',
        Image: { Bytes: imgBuffer },
      }).promise();

      const images = [];
      const userInfo = [];

      for (const face of res.FaceMatches ?? []) {
        const imageId = face.Face?.ExternalImageId;
        if (!imageId) continue;

        // Retrieve the face image and metadata from S3
        const s3Res = await s3.getObject({
          Bucket: 'digirail-s3-face',
          Key: 'faces/' + imageId + '.jpg',
        }).promise();

        const base64 = s3Res.Body?.toString('base64');
        const name = s3Res.Metadata?.name;
        const aadhar = s3Res.Metadata?.aadhar;
        const from = s3Res.Metadata?.from;
        const to = s3Res.Metadata?.to;
        const trainName = s3Res.Metadata?.trainname; // retrieve using lowercase key

        images.push(base64);
        userInfo.push({ name, aadhar, from, to, trainName });
      }

      return { matchedFaces: res.FaceMatches, images, userInfo };
    },
  })
  .mutation('clearUserData', {
    async resolve() {
      const collectionId = 'digirail_face';
      try {
        // Step 1: List all faces in the collection
        const listFacesResponse = await rekog.listFaces({ CollectionId: collectionId }).promise();
        const faceIds = listFacesResponse.Faces?.map(face => face.FaceId) || [];

        // Step 2: Delete faces from the collection
        if (faceIds.length > 0) {
          await rekog.deleteFaces({ CollectionId: collectionId, FaceIds: faceIds }).promise();
        }

        // Step 3: List all objects in the S3 bucket under the 'faces/' prefix
        const listObjectsResponse = await s3
          .listObjectsV2({
            Bucket: 'digirail-s3-face',
            Prefix: 'faces/',
          })
          .promise();

        // Step 4: Collect keys of all objects under the 'faces/' prefix
        const objectsToDelete = listObjectsResponse.Contents?.map((object) => ({
          Key: object.Key!,
        }));

        // Step 5: Delete the objects from S3
        if (objectsToDelete && objectsToDelete.length > 0) {
          await s3
            .deleteObjects({
              Bucket: 'digirail-s3-face',
              Delete: { Objects: objectsToDelete },
            })
            .promise();
        }

        return { success: true };
      } catch (error) {
        console.error('Failed to clear user data:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to clear user data',
        });
      }
    },
  });

// export type definition of API
export type AppRouter = typeof appRouter;

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => null,
});
