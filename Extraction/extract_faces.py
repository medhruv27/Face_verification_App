import cv2
import glob
import os
from deepface import DeepFace
import numpy as np

face_cascade=cv2.CascadeClassifier('haarcascade_frontalface_default.xml')

path = 'input/*.jpeg'

output_dir = "output"
os.makedirs(output_dir, exist_ok=True)


img_number = 1

img_list = glob.glob(path)

for file in img_list :
    img = cv2.imread(file, 1)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    if len(faces) == 0:
        print(f"No faces detected in {file}")
    else:
        for (x, y, w, h) in faces[0:2]:  # Process the first two faces
            # Step 2: Add padding to the face and crop the image
            p = 20  # Padding
            img_cropped = img[max(0, y - p):min(img.shape[0], y + h + p), 
                              max(0, x - p):min(img.shape[1], x + w + p)]

            # Step 3: Resize the cropped image back to the original image size
            resized = cv2.resize(img_cropped, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_LINEAR)

            # Step 4: Normalize the image to correct brightness and contrast
            norm_img = np.zeros((img.shape[0], img.shape[1]))
            norm_img = cv2.normalize(resized, norm_img, 0, 255, cv2.NORM_MINMAX)

            gray_img = cv2.cvtColor(norm_img, cv2.COLOR_BGR2GRAY)
            equalized_img = cv2.equalizeHist(gray_img)
            equalized_img = cv2.cvtColor(equalized_img, cv2.COLOR_GRAY2BGR)

            # Step 6: Apply Gaussian Blur to reduce noise (Optional)
            blurred_img = cv2.GaussianBlur(equalized_img, (5, 5), 0)

            # Step 7: Sharpen the image using a kernel
            kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])  # Sharpening kernel
            sharpened_img = cv2.filter2D(blurred_img, -1, kernel)

            # Save the processed face
            output_file = os.path.join(output_dir, f"{img_number}.jpg")
            cv2.imwrite(output_file, sharpened_img)
            print(f"Saved face {img_number} from {file} as {output_file}")
                    
            # # Save the processed face
            # output_file = os.path.join(output_dir, f"{img_number}.jpg")
            # cv2.imwrite(output_file, norm_img)
            # print(f"Saved face {img_number} from {file} as {output_file}")

            # Increment the image number
            img_number += 1
        
result = DeepFace.verify(
    img1_path = "output/1.jpg",
    img2_path = "output/2.jpg", 
    distance_metric= "cosine",
    model_name= "Facenet512",
    threshold= 0.47,                                                               
    detector_backend="retinaface",
    # align = False,
        )
if result['verified'] == True:
    print ("Identity Verified!")
    
else:
    print ("Verification failed!")
