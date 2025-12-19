export class CourseResponseDto {
  courseNo: number;
  courseId: string;
  courseView: boolean;
  places: {
    placeName: string;
    placeAddr: string;
    lat: number;
    lng: number;
  };

  constructor(c: any) {
    this.courseNo = c.course_no;
    this.courseId = c.course_id;
    this.courseView = c.course_view;
    this.places = {
      placeName: c.place_name,
      placeAddr: c.place_address,
      lat: c.place_lat,
      lng: c.place_lng,
    };
  }
}
