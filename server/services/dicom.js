import fs from "fs";
import dcmjs from "dcmjs";

export async function removePHI(inputFile) {
  try {
    // Read the DICOM file
    const dicomData = fs.readFileSync(inputFile).buffer;

    // Convert the parsed data to a DICOM dataset using dcmjs
    let dicomDict = dcmjs.data.DicomMessage.readFile(dicomData);
    const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomDict.dict);

    dataset.PatientName = "";
    dataset.PatientBirthDate = "";
    dataset.PatientID = "";
    dataset.OtherPatientIDs = "";
    dataset.StudyDescription = "";
    dataset.SeriesDescription = "";
    dataset.AccessionNumber = "";

    // Convert the dataset back to a DICOM file
    dicomDict.dict = dcmjs.data.DicomMetaDictionary.denaturalizeDataset(dataset);

    const writeBuffer = dicomDict.write();
    fs.writeFileSync(inputFile, Buffer.from(writeBuffer));

    console.log(`PHI removed and file overwritten: ${inputFile}`);
  } catch (error) {
    console.error("Error while removing PHI from DICOM file:", error);
    throw error;
  }
}
